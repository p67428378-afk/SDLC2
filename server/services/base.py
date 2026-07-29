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


class MortgageService(ABC):
    @abstractmethod
    def get_mortgages(self, customer_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def get_mortgage_details(
        self, customer_id: str, account_id: str
    ) -> Optional[Dict[str, Any]]:
        pass
