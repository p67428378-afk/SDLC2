from typing import Dict, Any, Optional
from server.services.fiserv import FiservMockService
from server.services.cenlar import CenlarMockService


class AggregationService:
    def __init__(
        self, fiserv_service: FiservMockService, cenlar_service: CenlarMockService
    ):
        self.fiserv = fiserv_service
        self.cenlar = cenlar_service

    def get_aggregated_dashboard(
        self, fiserv_cif: Optional[str], cenlar_customer_id: Optional[str]
    ) -> Dict[str, Any]:
        # Fetch profile
        profile = {}
        if fiserv_cif:
            profile_data = self.fiserv.get_customer_profile(fiserv_cif)
            if profile_data:
                profile = {
                    "cif": profile_data["cif"],
                    "first_name": profile_data["first_name"],
                    "last_name": profile_data["last_name"],
                    "email": profile_data["email"],
                }

        # Fetch banking accounts
        banking_accounts = []
        if fiserv_cif:
            banking_accounts = self.fiserv.get_accounts(fiserv_cif)

        # Separate deposits and loans
        deposits = []
        loans = []
        for acc in banking_accounts:
            if acc["type"] in ["DDA", "Savings", "CD"]:
                deposits.append(acc)
            elif acc["type"] == "Loan":
                loans.append(acc)

        # Fetch mortgages
        mortgages = []
        if cenlar_customer_id:
            mortgages = self.cenlar.get_mortgages(cenlar_customer_id)

        return {
            "customer_profile": profile,
            "accounts": {"deposits": deposits, "loans": loans, "mortgages": mortgages},
        }

    def get_relationship_summary(
        self, fiserv_cif: Optional[str], cenlar_customer_id: Optional[str]
    ) -> Dict[str, Any]:
        dashboard = self.get_aggregated_dashboard(fiserv_cif, cenlar_customer_id)

        total_deposits = sum(
            acc["balance"] for acc in dashboard["accounts"]["deposits"]
        )
        total_loans = sum(acc["balance"] for acc in dashboard["accounts"]["loans"])
        total_mortgages = sum(
            acc["principal_balance"] for acc in dashboard["accounts"]["mortgages"]
        )

        # Net worth = deposits - loans - mortgages
        net_worth = total_deposits - total_loans - total_mortgages

        return {
            "total_deposits": total_deposits,
            "total_loans": total_loans,
            "total_mortgages": total_mortgages,
            "net_worth": net_worth,
        }
