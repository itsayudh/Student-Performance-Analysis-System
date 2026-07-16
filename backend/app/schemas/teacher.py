from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import date
import re


class TeacherCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    employee_code: str
    department: str
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    joining_date: date

    @validator('first_name', 'last_name')
    def name_must_not_contain_scripts(cls, v):
        if re.search(r'[<>"\'/;`]', v):
            raise ValueError('Name contains invalid characters')
        return v.strip()

    @validator('employee_code')
    def validate_employee_code_format(cls, v):
        if not re.match(r'^TCH-\d{3,6}$', v):
            raise ValueError('Employee code must match format TCH-NNN')
        return v


class TeacherUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    department: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    is_active: Optional[bool] = None


class TeacherListItem(BaseModel):
    id: str
    employee_code: str
    first_name: str
    last_name: str
    department: str
    is_active: bool

    class Config:
        orm_mode = True


class TeacherListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[TeacherListItem]