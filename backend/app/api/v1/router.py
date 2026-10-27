from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.companies import router as companies_router
from app.api.v1.contacts import router as contacts_router
from app.api.v1.deals import router as deals_router
from app.api.v1.leads import router as leads_router
from app.api.v1.users import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(companies_router)
api_router.include_router(contacts_router)
api_router.include_router(leads_router)
api_router.include_router(deals_router)
