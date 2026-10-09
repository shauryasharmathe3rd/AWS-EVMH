from pydantic import BaseModel
from typing import Optional

class Principal(BaseModel):
    user_id: Optional[str] = "anonymous"
    is_authenticated: bool = False
    role: str = "guest"

def get_current_principal() -> Principal:
    """
    Auth seam: returns an anonymous principal today.
    Can be replaced with JWT or Cognito later without changing route signatures.
    """
    return Principal()
