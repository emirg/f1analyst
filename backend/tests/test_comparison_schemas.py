from app.schemas.f1 import (
    LapTimeEntry, ComparisonLapsResponse,
    SectorTime, ComparisonSectorsResponse,
    Stint, DriverStrategy, ComparisonStrategyResponse,
    PositionEntry, ComparisonPositionsResponse,
)

def test_lap_time_entry():
    entry = LapTimeEntry(lap_number=1, driver="VER", time_seconds=90.123, compound="SOFT")
    assert entry.lap_number == 1
    assert entry.driver == "VER"

def test_comparison_laps_response():
    laps = [LapTimeEntry(lap_number=1, driver="VER", time_seconds=90.0)]
    resp = ComparisonLapsResponse(driver1="VER", driver2="HAM", laps=laps)
    assert resp.driver1 == "VER"
    assert len(resp.laps) == 1

def test_sector_time():
    st = SectorTime(driver="VER", sector1=28.5, sector2=33.1, sector3=25.9)
    assert st.sector1 == 28.5

def test_stint():
    stint = Stint(stint_number=1, compound="SOFT", lap_start=1, lap_end=20, laps=20)
    assert stint.laps == 20

def test_position_entry():
    pe = PositionEntry(lap_number=5, driver="HAM", position=3)
    assert pe.position == 3
