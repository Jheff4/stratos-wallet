# Dashboard Feature

## Components

- `BalanceTrend`: 30‑day net worth line chart
- `SpendingChart`: Spending by category bar chart
- `PortfolioPie`: Account balance pie chart
- `DashboardPage`: Grid layout composing all widgets

## Data Sources

- Balance history from GraphQL `balanceHistory` query
- Spending from `spendingByCategory` query
- Portfolio from existing `accounts` query

All charts use Recharts and are responsive.
