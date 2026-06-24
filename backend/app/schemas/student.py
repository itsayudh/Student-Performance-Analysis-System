from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import date
import re


class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    student_code: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    program: str
    department: str
    admission_date: date

    @validator('first_name', 'last_name')
    def name_must_not_contain_scripts(cls, v):
        if re.search(r'[<>"\'/;`]', v):
            raise ValueError('Name contains invalid characters')
        return v.strip()

    @validator('student_code')
    def validate_student_code_format(cls, v):
        if not re.match(r'^STU-\d{4}-\d{3,6}$', v):
            raise ValueError('Student code must match format STU-YYYY-NNN')
        return v


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    program: Optional[str] = None
    department: Optional[str] = None


class StudentListItem(BaseModel):
    id: str
    student_code: str
    first_name: str
    last_name: str
    program: str
    department: str
    is_active: bool

    class Config:
        orm_mode = True


class StudentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[StudentListItem]


class StudentDetailResponse(BaseModel):
    id: str
    student_code: str
    first_name: str
    last_name: str
    program: str
    department: str
    admission_date: date
    is_active: bool

    class Config:
        orm_mode = True