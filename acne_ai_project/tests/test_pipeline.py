
import unittest
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from inference.pipeline import AcnePipeline

class TestAcnePipeline(unittest.TestCase):
    def setUp(self):
        self.pipeline = AcnePipeline()

    def test_mock_predict_structure(self):
        """Test that mock_predict returns the correct JSON structure."""
        result = self.pipeline.mock_predict("dummy_path.jpg")
        
        self.assertIn("status", result)
        self.assertIn("primary_diagnosis", result)
        self.assertIn("recommendations", result)
        self.assertEqual(result["status"], "success")
        
    def test_recommendations_content(self):
        """Test that recommendations are populated based on diagnosis."""
        result = self.pipeline.mock_predict("dummy.jpg")
        self.assertTrue(len(result["recommendations"]) > 0)
        
    def test_get_recommendations_logic(self):
        """Test specific recommendation retrieval."""
        recs = self.pipeline.get_recommendations("Blackheads", "Mild")
        self.assertTrue(any("Salicylic Acid" in r for r in recs))
        
        recs_severe = self.pipeline.get_recommendations("Cystic Acne", "Severe")
        self.assertTrue(any("Consult a dermatologist" in r for r in recs_severe))

if __name__ == '__main__':
    unittest.main()
