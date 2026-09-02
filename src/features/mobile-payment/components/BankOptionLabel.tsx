import { Box } from "@mui/material";

import type { Bank } from "../types";

type BankOptionLabelProps = Readonly<{
  bank: Bank;
}>;

export function BankOptionLabel({ bank }: BankOptionLabelProps) {
  return (
    <Box
      component="span"
      sx={{
        width: "100%",
        minWidth: 0,
        display: "grid",
        gridTemplateColumns: "4ch auto minmax(0, 1fr)",
        columnGap: 0.75,
        alignItems: "start",
        lineHeight: 1.35,
        whiteSpace: "normal",
      }}
    >
      <Box
        component="span"
        sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
      >
        {bank.code}
      </Box>
      <Box aria-hidden="true" component="span">
        ·
      </Box>
      <Box
        component="span"
        sx={{
          minWidth: 0,
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {bank.name}
      </Box>
    </Box>
  );
}
