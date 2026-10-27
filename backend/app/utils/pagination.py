import math
from typing import Generic, List, Sequence, TypeVar
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int

    model_config = ConfigDict(arbitrary_types_allowed=True, from_attributes=True)

    @classmethod
    def create(cls, items: Sequence[T], total: int, page: int, page_size: int) -> "Page[T]":
        pages = math.ceil(total / page_size) if page_size > 0 else 0
        return cls(
            items=list(items),
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )


async def paginate(
    db: AsyncSession,
    query: Select,
    page: int = 1,
    page_size: int = 20,
) -> tuple[Sequence, int]:
    """Applies pagination to an async SQLAlchemy query and returns (items, total_count)."""
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)

    # Count query
    count_query = select(func.count()).select_from(query.order_by(None).subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Data query
    offset = (page - 1) * page_size
    paginated_query = query.offset(offset).limit(page_size)
    result = await db.execute(paginated_query)
    items = result.scalars().all()

    return items, total
