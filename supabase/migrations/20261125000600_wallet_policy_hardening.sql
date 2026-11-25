-- Beaura wallet policy hardening
-- Remove permissive policies that allowed every authenticated user
-- to manage every user's cash requests and wallet ledger entries.

DROP POLICY IF EXISTS "Authenticated admins can manage cash requests"
  ON public.wallet_cash_requests;

DROP POLICY IF EXISTS "Authenticated admins can manage wallet transactions"
  ON public.wallet_transactions;

-- Admins may review and process cash-out requests.
-- Regular users retain their existing own-row SELECT/INSERT policies.
CREATE POLICY "Admins can view wallet cash requests"
  ON public.wallet_cash_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE a.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Admins can update wallet cash requests"
  ON public.wallet_cash_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE a.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE a.user_id = (SELECT auth.uid())
    )
  );

-- Wallet ledger entries are readable by their owner and admins.
-- Ledger writes should go through the trusted SECURITY DEFINER wallet RPCs,
-- not direct browser table writes.
CREATE POLICY "Admins can view wallet transactions"
  ON public.wallet_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admins a
      WHERE a.user_id = (SELECT auth.uid())
    )
  );
