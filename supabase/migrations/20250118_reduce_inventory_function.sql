-- Create function to reduce product inventory
-- This function is called when an order is placed to decrement the inventory count

CREATE OR REPLACE FUNCTION public.reduce_inventory(
  product_id UUID,
  quantity INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the product inventory by reducing the quantity
  UPDATE products
  SET inventory_count = inventory_count - quantity,
      updated_at = NOW()
  WHERE id = product_id
    AND inventory_count >= quantity; -- Only reduce if enough inventory exists

  -- Check if the update affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient inventory for product %', product_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users (service role will use this)
GRANT EXECUTE ON FUNCTION public.reduce_inventory(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reduce_inventory(UUID, INTEGER) TO service_role;

-- Add a comment to document the function
COMMENT ON FUNCTION public.reduce_inventory(UUID, INTEGER) IS
  'Reduces product inventory when an order is placed. Throws error if insufficient stock.';
