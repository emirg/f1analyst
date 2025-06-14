import pytest
from fastapi import HTTPException
from backend.app.utils import load_dummy_data, normalize_grand_prix, GRAND_PRIX_ALIASES

def test_load_dummy_data_success():
    """Test successful loading of dummy data"""
    result = load_dummy_data()
    assert isinstance(result, dict)
    assert "error" not in result

def test_load_dummy_data_error(monkeypatch):
    """Test error handling when loading dummy data fails"""
    def mock_open(*args, **kwargs):
        raise FileNotFoundError("File not found")
    
    monkeypatch.setattr("builtins.open", mock_open)
    result = load_dummy_data()
    assert isinstance(result, dict)
    assert "error" in result
    assert result["error"] == "Failed to load dummy data"

def test_normalize_grand_prix_valid_inputs():
    """Test normalization of valid Grand Prix names"""
    test_cases = [
        ("Australian Grand Prix", "Australian Grand Prix"),
        ("australiangrandprix", "Australian Grand Prix"),
        ("australian-grand-prix", "Australian Grand Prix"),
        ("australian_grand_prix", "Australian Grand Prix"),
        ("AUSTRALIAN GRAND PRIX", "Australian Grand Prix"),
    ]
    
    for input_name, expected in test_cases:
        assert normalize_grand_prix(input_name) == expected

def test_normalize_grand_prix_invalid_input():
    """Test handling of invalid Grand Prix names"""
    with pytest.raises(HTTPException) as exc_info:
        normalize_grand_prix("Invalid Grand Prix")
    
    assert exc_info.value.status_code == 404
    assert "Unknown Grand Prix" in str(exc_info.value.detail)

def test_normalize_grand_prix_all_aliases():
    """Test that all aliases in GRAND_PRIX_ALIASES are valid"""
    for alias, normalized in GRAND_PRIX_ALIASES.items():
        assert normalize_grand_prix(alias) == normalized 