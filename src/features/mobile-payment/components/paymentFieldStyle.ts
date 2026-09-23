// Keep every payment field visually consistent, including selects and the
// directory search field. Individual fields may still control their width.
export const paymentFieldSx = {
  minWidth: 0,
  "& .MuiOutlinedInput-root": {
    minHeight: "3rem",
    borderRadius: "0.75rem",
    bgcolor: "#F4F5F8",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#D7DAE5",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#A7ADC3",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "primary.main",
    },
    "&.Mui-error .MuiOutlinedInput-notchedOutline": {
      borderColor: "error.main",
    },
  },
  "& .MuiOutlinedInput-input": {
    px: "0.875rem",
    py: "0.75rem",
    fontSize: "0.875rem",
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    pr: "2.5rem !important",
    whiteSpace: "normal !important",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.875rem",
  },
  "& .MuiFormHelperText-root": {
    mx: "0.25rem",
    fontSize: "0.75rem",
  },
} as const;
