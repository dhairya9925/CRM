"""Supabase Migration Tool for Apex CRM

Migrates schema (via Alembic) and all data from local PostgreSQL to Supabase Session Pooler.
Compatible with asyncpg and Supabase PgBouncer/Supavisor pooling.

Usage:
    uv run python scripts/migrate_to_supabase.py [--source-url <LOCAL_URL>] [--target-url <SUPABASE_URL>]
"""

import argparse
import asyncio
import os
import sys
from typing import Dict, List
from sqlalchemy import MetaData, Table, inspect, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from alembic.config import Config
from alembic import command

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings


def normalize_url(url: str) -> str:
    url = url.strip().strip("'").strip('"')
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


# Ordered list of tables according to foreign key dependencies
TABLE_ORDER = [
    "users",
    "companies",
    "contacts",
    "deals",
    "leads",
    "tasks",
    "activities",
]


async def test_connection(engine, name: str):
    print(f"[*] Testing connection to {name}...")
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT version()"))
        ver = res.scalar()
    print(f"[+] Successfully connected to {name}: {ver[:40]}...")


def apply_alembic_stamp_or_upgrade(target_url: str):
    print("\n[*] Synchronizing Alembic migrations on Supabase...")
    alembic_ini_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    alembic_cfg = Config(alembic_ini_path)
    alembic_cfg.set_main_option("sqlalchemy.url", target_url)
    try:
        command.upgrade(alembic_cfg, "head")
        print("[+] Alembic upgrade head executed.")
    except Exception as e:
        print(f"[!] Tables already created, stamping head: {e}")
        try:
            command.stamp(alembic_cfg, "head")
            print("[+] Alembic stamped to head.")
        except Exception as stamp_err:
            print(f"[!] Alembic stamp warning: {stamp_err}")


import app.models  # Ensure all models are loaded in Base.metadata
from app.database import Base


async def copy_table_data(src_session: AsyncSession, dst_session: AsyncSession, table_name: str) -> int:
    # 1. Fetch from source
    fetch_query = text(f"SELECT * FROM public.{table_name}")
    result = await src_session.execute(fetch_query)
    rows = [dict(row._mapping) for row in result.fetchall()]
    
    if not rows:
        return 0

    # 2. Get table definition from Base.metadata
    table = Base.metadata.tables[table_name]

    # 3. Bulk insert rows
    await dst_session.execute(table.insert(), rows)
    await dst_session.commit()
    return len(rows)


async def migrate_all_data(src_url: str, dst_url: str):
    src_engine = create_async_engine(src_url, pool_pre_ping=True)
    dst_engine = create_async_engine(
        dst_url,
        pool_pre_ping=True,
        connect_args={
            "statement_cache_size": 0,
            "ssl": "require",
        },
    )

    await test_connection(src_engine, "Source (Local DB)")
    await test_connection(dst_engine, "Destination (Supabase)")

    src_session_factory = async_sessionmaker(src_engine, class_=AsyncSession, expire_on_commit=False)
    dst_session_factory = async_sessionmaker(dst_engine, class_=AsyncSession, expire_on_commit=False)

    # Clean destination tables in reverse order to respect foreign keys
    print("\n[*] Preparing destination tables (cleaning existing records)...")
    async with dst_session_factory() as dst_sess:
        for tbl in reversed(TABLE_ORDER):
            try:
                await dst_sess.execute(text(f"TRUNCATE TABLE public.{tbl} CASCADE"))
            except Exception as e:
                print(f"    Notice truncating {tbl}: {e}")
        await dst_sess.commit()
    print("[+] Destination tables cleaned.")

    print("\n[*] Migrating table data from Local DB -> Supabase...")
    summary: Dict[str, Dict[str, int]] = {}

    async with src_session_factory() as src_sess, dst_session_factory() as dst_sess:
        for tbl in TABLE_ORDER:
            try:
                src_count = (await src_sess.execute(text(f"SELECT count(*) FROM public.{tbl}"))).scalar() or 0
                copied = await copy_table_data(src_sess, dst_sess, tbl)
                dst_count = (await dst_sess.execute(text(f"SELECT count(*) FROM public.{tbl}"))).scalar() or 0
                summary[tbl] = {"source": src_count, "destination": dst_count}
                print(f"  -> {tbl:<15} : {src_count} source rows copied => {dst_count} in Supabase")
            except Exception as e:
                print(f"  [!] Error copying table {tbl}: {e}")
                summary[tbl] = {"error": str(e)}

    await src_engine.dispose()
    await dst_engine.dispose()

    print("\n" + "=" * 60)
    print("MIGRATION VERIFICATION REPORT")
    print("=" * 60)
    all_matched = True
    for tbl, info in summary.items():
        if "error" in info:
            print(f"  {tbl:<15} [FAILED] Error: {info['error']}")
            all_matched = False
        else:
            is_match = info["source"] == info["destination"]
            status = "MATCHED (100%)" if is_match else "MISMATCH"
            if not is_match:
                all_matched = False
            print(f"  {tbl:<15} [{status}] Source: {info['source']:<3} -> Supabase: {info['destination']:<3}")
    print("=" * 60)

    if all_matched:
        print("[+] SUCCESS: All data successfully migrated to Supabase with 100% parity!")
    else:
        print("[!] WARNING: Some tables experienced differences or errors.")


def main():
    parser = argparse.ArgumentParser(description="Migrate Apex CRM data to Supabase")
    parser.add_argument(
        "--source-url",
        default="postgresql+asyncpg://dhairya:8953@localhost:5432/crm_db",
        help="Local PostgreSQL connection URI (default: crm_db on localhost:5432)",
    )
    parser.add_argument(
        "--target-url",
        default=settings.DATABASE_URL,
        help="Supabase Session Pooler connection URI (reads from backend/.env by default)",
    )
    args = parser.parse_args()

    normalized_src = normalize_url(args.source_url)
    normalized_dst = normalize_url(args.target_url)

    print(f"[*] Source Database: {normalized_src.split('@')[-1]}")
    print(f"[*] Target Supabase: {normalized_dst.split('@')[-1]}")

    asyncio.run(migrate_all_data(normalized_src, normalized_dst))


if __name__ == "__main__":
    main()
