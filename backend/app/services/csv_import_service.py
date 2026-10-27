import csv
import io
from typing import Any, Dict, List
import uuid
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.user import User
from app.schemas.lead import LeadImportResponse


class CsvImportService:
    @staticmethod
    async def import_leads_from_csv(
        db: AsyncSession, file: UploadFile, current_user: User
    ) -> LeadImportResponse:
        content = await file.read()
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1")

        csv_reader = csv.DictReader(io.StringIO(text))
        imported_count = 0
        failed_count = 0
        errors: List[Dict[str, Any]] = []

        row_index = 1
        new_leads: List[Lead] = []

        for row in csv_reader:
            row_index += 1
            # Normalize headers (lowercase and stripped)
            normalized_row = {
                k.strip().lower().replace(" ", "_"): (v.strip() if v else "")
                for k, v in row.items()
                if k
            }

            first_name = (
                normalized_row.get("first_name")
                or normalized_row.get("firstname")
                or normalized_row.get("first")
                or ""
            )
            last_name = (
                normalized_row.get("last_name")
                or normalized_row.get("lastname")
                or normalized_row.get("last")
                or ""
            )
            email = normalized_row.get("email") or None
            phone = normalized_row.get("phone") or None
            company_name = (
                normalized_row.get("company_name")
                or normalized_row.get("company")
                or None
            )

            if not first_name or not last_name:
                failed_count += 1
                errors.append(
                    {
                        "row": row_index,
                        "error": "Missing required first_name or last_name",
                        "data": row,
                    }
                )
                continue

            raw_source = normalized_row.get("source", "website").lower()
            source = (
                raw_source
                if raw_source in [s.value for s in LeadSource]
                else LeadSource.OTHER.value
            )

            raw_status = normalized_row.get("status", "new").lower()
            status = (
                raw_status
                if raw_status in [s.value for s in LeadStatus]
                else LeadStatus.NEW.value
            )

            lead = Lead(
                first_name=first_name,
                last_name=last_name,
                email=email.lower() if email else None,
                phone=phone,
                company_name=company_name,
                source=source,
                status=status,
                assigned_to=current_user.id,
            )
            new_leads.append(lead)
            imported_count += 1

        if new_leads:
            db.add_all(new_leads)
            await db.commit()

        return LeadImportResponse(
            imported=imported_count,
            failed=failed_count,
            errors=errors,
        )
