import pytest

from backtest_export._validation import (
    ValidationError,
    validate_payload,
    validate_series,
    validate_trade,
)


class TestValidateTrade:
    def test_valid_trade(self):
        trade = {
            "entry_time": "2024-01-15",
            "exit_time": "2024-01-20",
            "direction": "long",
            "entry_price": 150.0,
            "exit_price": 155.0,
        }
        assert validate_trade(trade, 0) == []

    def test_missing_required_field(self):
        trade = {"entry_time": "2024-01-15", "direction": "long"}
        errors = validate_trade(trade, 0)
        assert any("exit_time" in e for e in errors)
        assert any("entry_price" in e for e in errors)
        assert any("exit_price" in e for e in errors)

    def test_invalid_direction(self):
        trade = {
            "entry_time": "2024-01-15",
            "exit_time": "2024-01-20",
            "direction": "up",
            "entry_price": 150.0,
            "exit_price": 155.0,
        }
        errors = validate_trade(trade, 0)
        assert any("'long' or 'short'" in e for e in errors)

    def test_non_numeric_price(self):
        trade = {
            "entry_time": "2024-01-15",
            "exit_time": "2024-01-20",
            "direction": "long",
            "entry_price": "not_a_number",
            "exit_price": 155.0,
        }
        errors = validate_trade(trade, 0)
        assert any("entry_price" in e and "number" in e for e in errors)

    def test_exit_before_entry(self):
        trade = {
            "entry_time": "2024-01-20",
            "exit_time": "2024-01-15",
            "direction": "long",
            "entry_price": 150.0,
            "exit_price": 155.0,
        }
        errors = validate_trade(trade, 0)
        assert any("after entry_time" in e for e in errors)


class TestValidateSeries:
    def test_valid_series(self):
        series = {
            "id": "rsi",
            "label": "RSI",
            "type": "line",
            "data": [{"time": "2024-01-15", "value": 50}],
        }
        assert validate_series(series, 0) == []

    def test_missing_id(self):
        series = {"label": "RSI", "data": []}
        errors = validate_series(series, 0)
        assert any("id" in e for e in errors)

    def test_invalid_type(self):
        series = {"id": "x", "label": "X", "type": "bar", "data": []}
        errors = validate_series(series, 0)
        assert any("'line', 'histogram', or 'area'" in e for e in errors)


class TestValidatePayload:
    def test_valid_payload(self):
        payload = {
            "metadata": {
                "ticker": "AAPL",
                "period": "1Y",
                "capital_initial": 10000,
                "strategy": "Test",
            },
            "trades": [
                {
                    "entry_time": "2024-01-15",
                    "exit_time": "2024-01-20",
                    "direction": "long",
                    "entry_price": 150.0,
                    "exit_price": 155.0,
                }
            ],
        }
        assert validate_payload(payload) == []

    def test_missing_metadata(self):
        payload = {"trades": []}
        errors = validate_payload(payload)
        assert any("metadata" in e for e in errors)

    def test_missing_trades(self):
        payload = {
            "metadata": {
                "ticker": "AAPL",
                "period": "1Y",
                "capital_initial": 10000,
                "strategy": "Test",
            }
        }
        errors = validate_payload(payload)
        assert any("trades" in e for e in errors)

    def test_non_numeric_capital(self):
        payload = {
            "metadata": {
                "ticker": "AAPL",
                "period": "1Y",
                "capital_initial": "oops",
                "strategy": "Test",
            },
            "trades": [],
        }
        errors = validate_payload(payload)
        assert any("capital_initial" in e and "number" in e for e in errors)
