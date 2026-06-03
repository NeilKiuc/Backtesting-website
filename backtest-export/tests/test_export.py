import json
import tempfile
from pathlib import Path

import pytest

from backtest_export import Backtest, ValidationError


class TestExport:
    def test_export_creates_valid_json(self, tmp_path):
        out = tmp_path / "result.json"
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000, strategy="MACD")
        bt.add_trade(
            entry_time="2024-01-15",
            exit_time="2024-01-20",
            direction="long",
            entry_price=150.0,
            exit_price=158.0,
        )
        bt.add_series(
            id="rsi_14",
            label="RSI (14)",
            type="line",
            color="#2196F3",
            data=[{"time": "2024-01-15", "value": 45.2}],
            reference_lines=[
                {"value": 70, "label": "Overbought", "style": "dashed"},
                {"value": 30, "label": "Oversold", "style": "dashed"},
            ],
        )

        result_path = bt.export(out)
        assert result_path.exists()

        data = json.loads(out.read_text(encoding="utf-8"))
        assert data["metadata"]["ticker"] == "AAPL"
        assert len(data["trades"]) == 1
        assert len(data["equity_curve"]) == 2
        assert len(data["custom_series"]) == 1

    def test_export_returns_absolute_path(self, tmp_path):
        out = tmp_path / "result.json"
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        bt.add_trade(
            entry_time="2024-01-15",
            exit_time="2024-01-20",
            direction="long",
            entry_price=100.0,
            exit_price=110.0,
        )
        result = bt.export(out)
        assert result.is_absolute()

    def test_to_dict_matches_export(self, tmp_path):
        out = tmp_path / "result.json"
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        bt.add_trade(
            entry_time="2024-01-15",
            exit_time="2024-01-20",
            direction="long",
            entry_price=100.0,
            exit_price=110.0,
        )
        dict_result = bt.to_dict()
        bt.export(out)
        file_result = json.loads(out.read_text(encoding="utf-8"))
        assert dict_result == file_result

    def test_validate_returns_errors(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        errors = bt.validate()
        assert errors == []

    def test_cross_validation_with_backend_format(self, tmp_path):
        """The exported JSON should have the exact structure the backend expects."""
        out = tmp_path / "result.json"
        bt = Backtest(ticker="TSLA", period="6M", capital=50000, strategy="RSI Mean Reversion")
        bt.add_trade(
            entry_time="2024-03-01T09:30:00",
            exit_time="2024-03-05T16:00:00",
            direction="long",
            entry_price=200.0,
            exit_price=215.0,
            fees=5.0,
        )
        bt.add_trade(
            entry_time="2024-04-01",
            exit_time="2024-04-10",
            direction="short",
            entry_price=210.0,
            exit_price=195.0,
        )
        bt.export(out)

        data = json.loads(out.read_text(encoding="utf-8"))

        assert "metadata" in data
        assert "trades" in data
        assert "equity_curve" in data

        meta = data["metadata"]
        assert all(k in meta for k in ("ticker", "period", "capital_initial", "strategy"))
        assert isinstance(meta["capital_initial"], (int, float))

        for trade in data["trades"]:
            assert all(
                k in trade
                for k in ("entry_time", "exit_time", "direction", "entry_price", "exit_price")
            )
            assert trade["direction"] in ("long", "short")
