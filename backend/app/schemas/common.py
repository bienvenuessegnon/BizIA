from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

SourceType = Literal["manual", "csv", "excel", "unknown"]


class ProductIn(BaseModel):
    sku: str = Field(min_length=1)
    name: str = Field(min_length=1)
    category: str | None = None
    unit_cost: float = Field(ge=0)
    unit_price: float = Field(ge=0)
    stock_quantity: float = Field(default=0, ge=0)
    low_stock_threshold: float = Field(default=5, ge=0)


class Product(ProductIn):
    id: str


class SaleIn(BaseModel):
    product_sku: str = Field(min_length=1)
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    unit_cost: float | None = Field(default=None, ge=0)
    sold_at: datetime | None = None
    channel: str | None = None


class Sale(BaseModel):
    id: str
    product_sku: str
    quantity: float
    unit_price: float
    unit_cost: float
    sold_at: datetime
    channel: str | None = None


class CanonicalDataset(BaseModel):
    source: SourceType = "unknown"
    products: list[Product] = Field(default_factory=list)
    sales: list[Sale] = Field(default_factory=list)


class ErrorBody(BaseModel):
    code: str
    message: str


class RegisterIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)
