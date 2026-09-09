"""
Property-based tests for OTP whitelist email delivery.
Feature: project-selector-and-auth-improvements

Uses Hypothesis to verify two correctness properties from the design document.
"""

import os
import pytest
from unittest.mock import patch
from hypothesis import given, settings as h_settings, assume, HealthCheck
from hypothesis import strategies as st

import app.services.email_service as svc


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _valid_email_strategy():
    """Generate simple valid email addresses (user@domain.tld)."""
    local = st.text(
        alphabet="abcdefghijklmnopqrstuvwxyz0123456789",
        min_size=1, max_size=10
    )
    domain = st.text(
        alphabet="abcdefghijklmnopqrstuvwxyz",
        min_size=2, max_size=8
    )
    tld = st.sampled_from(["com", "net", "org", "io", "dev"])
    return st.builds(lambda l, d, t: f"{l}@{d}.{t}", local, domain, tld)


# ---------------------------------------------------------------------------
# Property 1: OTP whitelist additive delivery
#
# Feature: project-selector-and-auth-improvements, Property 1: OTP whitelist additive delivery
# Validates: Requirements 1.1, 1.2
#
# For any primary recipient email and any list of N valid email addresses in
# EMAIL_WHITELIST, the email service attempts to send the OTP code to exactly
# N+1 destinations. When N=0 (empty whitelist), exactly 1 send attempt is made.
# ---------------------------------------------------------------------------

@given(
    primary=_valid_email_strategy(),
    whitelist=st.lists(_valid_email_strategy(), min_size=0, max_size=10),
)
@h_settings(max_examples=100)
def test_property1_otp_whitelist_additive_delivery(primary, whitelist):
    """
    Feature: project-selector-and-auth-improvements, Property 1: OTP whitelist additive delivery
    Validates: Requirements 1.1, 1.2
    """
    assume(primary not in whitelist)

    whitelist_str = ",".join(whitelist)
    send_calls = []

    def fake_send(message, user, password, host):
        send_calls.append(message["To"])
        return True

    with patch.dict(os.environ, {"EMAIL_WHITELIST": whitelist_str}, clear=False), \
         patch.object(svc, "_load_smtp_credentials",
                      return_value=("sender@test.com", "fakepassword", "smtp.test.com", "sender@test.com")), \
         patch.object(svc, "_send_message", side_effect=fake_send):

        send_calls.clear()
        svc.send_otp_email(primary, "123456")

    expected = 1 + len(whitelist)
    assert len(send_calls) == expected, (
        f"Expected {expected} send attempts (1 primary + {len(whitelist)} whitelist), "
        f"got {len(send_calls)}"
    )


# ---------------------------------------------------------------------------
# Property 2: Whitelist failure isolation
#
# Feature: project-selector-and-auth-improvements, Property 2: Whitelist failure isolation
# Validates: Requirements 1.3
#
# For any combination of addresses in EMAIL_WHITELIST where a random subset
# fails, the email service does not raise an exception and attempts delivery
# to all addresses regardless of which ones fail.
# ---------------------------------------------------------------------------

@given(
    primary=_valid_email_strategy(),
    whitelist=st.lists(_valid_email_strategy(), min_size=1, max_size=8),
    failing_indices=st.lists(st.integers(min_value=0, max_value=7), unique=True),
)
@h_settings(max_examples=100)
def test_property2_whitelist_failure_isolation(primary, whitelist, failing_indices):
    """
    Feature: project-selector-and-auth-improvements, Property 2: Whitelist failure isolation
    Validates: Requirements 1.3
    """
    assume(primary not in whitelist)

    valid_failing = {i for i in failing_indices if i < len(whitelist)}
    whitelist_str = ",".join(whitelist)
    call_counter = {"n": 0}

    def side_effect_send(message, user, password, host):
        idx = call_counter["n"]
        call_counter["n"] += 1
        if idx == 0:
            return True  # primary always succeeds
        whitelist_idx = idx - 1
        if whitelist_idx in valid_failing:
            raise Exception(f"Simulated SMTP failure for index {whitelist_idx}")
        return True

    with patch.dict(os.environ, {"EMAIL_WHITELIST": whitelist_str}, clear=False), \
         patch.object(svc, "_load_smtp_credentials",
                      return_value=("sender@test.com", "fakepassword", "smtp.test.com", "sender@test.com")), \
         patch.object(svc, "_send_message", side_effect=side_effect_send):

        call_counter["n"] = 0

        try:
            svc.send_otp_email(primary, "654321")
        except Exception as exc:
            pytest.fail(f"send_otp_email raised an exception despite whitelist failure: {exc}")

    assert call_counter["n"] == 1 + len(whitelist), (
        f"Expected {1 + len(whitelist)} total send attempts, got {call_counter['n']}"
    )
