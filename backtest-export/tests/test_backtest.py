import pytest
from datetime import datetime

from backtest_export import Backtest, ValidationError


class TestConstructor:
    def test_stores_metadata(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        d = bt.to_dict()
        assert d["metadata"]["ticker"] == "AAPL"
        assert d["metadata"]["period"] == "1Y"
        assert d["metadata"]["capital_initial"] == 10000
        assert d["metadata"]["strategy"] == "Custom Strategy"

    def test_custom_strategy(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000, strategy="MACD")
        assert bt.to_dict()["metadata"]["strategy"] == "MACD"


class TestAddTrade:
    def test_basic_long(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        bt.add_trade(
            entry_time="2024-01-15",
            exit_time="2024-01-20",
            direction="long",
            entry_price=100.0,
            exit_price=110.0,
        )
        trades = bt.to_dict()["trades"]
        assert len(trades) == 1
        assert trades[0]["pnl_pct"] == 10.0

    def test_short_pnl(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        bt.add_trade(
            entry_time="2024-01-15",
            exit_time="2024-01-20",
            direction="short",
            entry_price=100.0,
            exit_price=90.0,
        )
        assert bt.to_dict()["trades"][0]["pnl_pct"] == 10.0

    def test_fees_reduce_pnl(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        bt.add_trade(
            entry_time="2024-01-15",
            exit_time="2024-01-20",
            direction="long",
            entry_price=100.0,
            exit_price=110.0,
            fees=5.0,
        )
        assert bt.to_dict()["trades"][0]["pnl_pct"] == 5.0

    def test_user_provided_pnl(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        bt.add_trade(
            entry_time="2024-01-15",
            exit_time="2024-01-20",
            direction="long",
            entry_price=100.0,
            exit_price=110.0,
            pnl_pct=42.0,
        )
        assert bt.to_dict()["trades"][0]["pnl_pct"] == 42.0

    def test_chaining(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        result = bt.add_trade(
            entry_time="2024-01-15",
            exit_time="2024-01-20",
            direction="long",
            entry_price=100.0,
            exit_price=110.0,
        )
        assert result is bt

    def test_invalid_direction_raises(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        with pytest.raises(ValidationError, match="'long' or 'short'"):
            bt.add_trade(
                entry_time="2024-01-15",
                exit_time="2024-01-20",
                direction="up",
                entry_price=100.0,
                exit_price=110.0,
            )

    def test_exit_before_entry_raises(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        with pytest.raises(ValidationError, match="after entry_time"):
            bt.add_trade(
                entry_time="2024-01-20",
                exit_time="2024-01-15",
                direction="long",
                entry_price=100.0,
                exit_price=110.0,
            )

    def test_accepts_datetime_objects(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        bt.add_trade(
            entry_time=datetime(2024, 1, 15, 9, 30),
            exit_time=datetime(2024, 1, 20, 16, 0),
            direction="long",
            entry_price=100.0,
            exit_price=110.0,
        )
        trade = bt.to_dict()["trades"][0]
        assert trade["entry_time"] == "2024-01-15T09:30:00"
        assert trade["exit_time"] == "2024-01-20T16:00:00"


class TestAddSeries:
    def test_basic_series(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        bt.add_series(
            id="rsi",
            label="RSI (14)",
            type="line",
            data=[{"time": "2024-01-15", "value": 50}],
            color="#2196F3",
        )
        series = bt.to_dict()["custom_series"]
        assert len(series) == 1
        assert series[0]["id"] == "rsi"
        assert series[0]["color"] == "#2196F3"

    def test_invalid_type_raises(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        with pytest.raises(ValidationError, match="'line', 'histogram', or 'area'"):
            bt.add_series(id="x", label="X", type="bar", data=[])

    def test_chaining(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        result = bt.add_series(id="x", label="X", data=[])
        assert result is bt


class TestEquityCurve:
    def test_equity_curve_built(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        bt.add_trade(
            entry_time="2024-01-15",
            exit_time="2024-01-20",
            direction="long",
            entry_price=100.0,
            exit_price=110.0,
        )
        curve = bt.to_dict()["equity_curve"]
        assert len(curve) == 2
        assert curve[0]["strategy"] == 10000
        assert curve[1]["strategy"] == 11000.0

    def test_empty_trades_no_curve(self):
        bt = Backtest(ticker="AAPL", period="1Y", capital=10000)
        assert bt.to_dict()["equity_curve"] == []
