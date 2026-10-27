from typing import Optional
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import get_current_active_user, get_db, require_admin
from app.core.exceptions import CredentialsError
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    SignupRequest,
    TokenResponse,
)
from app.schemas.user import UserCreate, UserProfileUpdate, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Public user registration / sign up",
)
async def signup(
    signup_data: SignupRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """Allows a new user to self-register. Creates account with sales_rep role and returns auth tokens."""
    user_in = UserCreate(
        email=signup_data.email,
        password=signup_data.password,
        full_name=signup_data.full_name,
        role=UserRole.SALES_REP,
        is_active=True,
    )
    user = await AuthService.register_user(db=db, user_in=user_in)
    tokens = AuthService.generate_token_response(user)

    # Set HttpOnly access token and refresh token cookies
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
        secure=False,
        path="/",
    )

    return tokens


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user (Admin only)",
)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    """Admin-only endpoint to provision a new user account with a specified role."""
    return await AuthService.register_user(db=db, user_in=user_in)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and issue JWT tokens",
)
async def login(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    login_data: Optional[LoginRequest] = None,
):
    """Authenticate with email and password via JSON payload or OAuth2 form.
    Returns access token and refresh token, and sets HttpOnly refresh cookie.
    """
    email: Optional[str] = None
    password: Optional[str] = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        email = body.get("email")
        password = body.get("password")
    elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")
    elif login_data:
        email = login_data.email
        password = login_data.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email/username and password are required",
        )

    user = await AuthService.authenticate_user(db=db, email=str(email), password=str(password))
    tokens = AuthService.generate_token_response(user)

    # Set HttpOnly access token and refresh token cookies
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # Set to True in HTTPS production
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
        secure=False,  # Set to True in HTTPS production
        path="/",
    )

    return tokens


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and issue new access token",
)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    body: Optional[RefreshTokenRequest] = None,
    cookie_token: Optional[str] = Cookie(None, alias="refresh_token"),
):
    """Rotates refresh token. Accepts token from JSON body or HttpOnly cookie."""
    token = None
    if body and body.refresh_token:
        token = body.refresh_token
    elif cookie_token:
        token = cookie_token

    if not token:
        raise CredentialsError("Refresh token missing from request body and cookie")

    tokens = await AuthService.refresh_tokens(db=db, refresh_token=token)

    # Set new cookies
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        samesite="lax",
        secure=False,
        path="/",
    )

    return tokens


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out user and clear session cookies",
)
async def logout(
    response: Response,
    current_user: User = Depends(get_current_active_user),
):
    """Clears authentication session cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return MessageResponse(message="Successfully logged out")


@router.post(
    "/password-reset/request",
    response_model=MessageResponse,
    summary="Request password reset token",
)
async def request_password_reset(
    req: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generates password reset token. In production this would send an email."""
    token = await AuthService.request_password_reset(db=db, email=req.email)
    detail = "If the email is registered, password reset instructions have been generated."
    # In development mode, return the token for testing convenience
    if settings.ENVIRONMENT == "development" and token:
        return MessageResponse(message=f"{detail} [Dev Token: {token}]")
    return MessageResponse(message=detail)


@router.post(
    "/password-reset/confirm",
    response_model=MessageResponse,
    summary="Confirm password reset using token",
)
async def confirm_password_reset(
    req: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
):
    """Resets password if reset token is valid and unexpired."""
    await AuthService.confirm_password_reset(
        db=db, token=req.token, new_password=req.new_password
    )
    return MessageResponse(message="Password has been reset successfully")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
):
    """Returns profile details of the authenticated user."""
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
)
async def update_me(
    profile_in: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update profile details (name, password) for the authenticated user."""
    return await AuthService.update_profile(
        db=db, user=current_user, update_data=profile_in
    )
