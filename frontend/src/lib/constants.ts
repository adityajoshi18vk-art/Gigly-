export const STATUS_MAP: Record<number, string> = {
  0: "None",
  1: "Funded",
  2: "Submitted",
  3: "Disputed",
  4: "Released",
  5: "Refunded"
};

export const STATUS_COLORS: Record<number, "default" | "success" | "pending" | "danger"> = {
  0: "default",   // None -> Gray
  1: "default",   // Funded -> Teal/Primary
  2: "pending",   // Submitted -> Amber
  3: "danger",    // Disputed -> Red/Coral
  4: "success",   // Released -> Green
  5: "default"    // Refunded -> Gray
};
