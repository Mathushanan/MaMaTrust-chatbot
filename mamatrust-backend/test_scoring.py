"""Offline regression checks; no provider calls or API key required."""
import json
import sys
import types
import unittest
from unittest.mock import patch
# Only shim the optional environment loader if unavailable in this test runtime.
try:
    import dotenv
except ImportError:
    shim = types.ModuleType('dotenv')
    shim.load_dotenv = lambda: None
    sys.modules['dotenv'] = shim
import agreement_scoring as a

class ScoringTests(unittest.TestCase):
    def test_flagged_educational_chunk_does_not_override(self):
        chunk = dict(chunk_id='trial', source_name='Trial', source_url='https://example.test',
                     text='Studies of formula timing showed different outcomes.', escalation_flag=True)
        raw = json.dumps(dict(verdict='Partial', confidence=0.8, explanation='The studies differed.',
                              cited_sources=[dict(chunk_id='trial', stance='Mixed study outcomes')]))
        with patch.object(a, 'call_llm', return_value=raw):
            r = a.score_claim('What do these studies show?', [chunk])
        self.assertEqual(r.verdict, 'Partial')
        self.assertFalse(r.escalate)

    def test_current_symptoms_bypass_without_evidence(self):
        with patch.object(a, 'call_llm', side_effect=AssertionError('Must bypass provider')):
            r = a.score_claim("My baby is turning blue and can't breathe after eating", [])
        self.assertEqual(r.verdict, 'Escalate')

    def test_historical_trial_is_not_personal_report(self):
        self.assertFalse(a.check_user_symptoms('Why did infants have severe reactions in the HEAP trial?')[0])

    def test_no_evidence_is_uncertain(self):
        self.assertEqual(a.score_claim('Does this prevent allergy?', []).verdict, 'Uncertain')

    def test_unknown_citation_fails(self):
        raw = json.dumps(dict(verdict='Supported', confidence=0.8, explanation='Answer.',
                              cited_sources=[dict(chunk_id='invented', stance='Claim')]))
        with patch.object(a, 'call_llm', return_value=raw):
            with self.assertRaises(ValueError):
                a.score_claim('General question', [dict(chunk_id='real', source_name='Source', text='Evidence')])

    def test_invalid_confidence(self):
        with self.assertRaises(ValueError):
            a.parse_llm_response(json.dumps(dict(verdict='Partial', confidence=2,
                                                explanation='Answer', cited_sources=[])))

if __name__ == '__main__':
    unittest.main()
