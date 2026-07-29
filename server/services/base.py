from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class CoreBankingService(ABC):
    @abstractmethod
    def get_customer_profile(self, cif: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_accounts(self, cif: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_account_details(
        self, cif: str, account_id: str
    ) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def validate_account(self, account_id: str) -> bool:
        pass

    @abstractmethod
    def get_available_balance(self, account_id: str) -> Optional[float]:
        pass

    @abstractmethod
    def debit_account(self, account_id: str, amount: float) -> bool:
        pass

    @abstractmethod
    def credit_account(self, account_id: str, amount: float) -> bool:
        pass


class MortgageService(ABC):
    @abstractmethod
    def get_mortgages(self, customer_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_mortgage_details(
        self, customer_id: str, account_id: str
    ) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def process_payment(self, mortgage_account_id: str, amount: float) -> bool:
        pass

    @abstractmethod
    def reverse_payment(self, mortgage_account_id: str, amount: float) -> bool:
        pass
