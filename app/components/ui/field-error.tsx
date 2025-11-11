
export const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-red-500">{msg}</p> : null;