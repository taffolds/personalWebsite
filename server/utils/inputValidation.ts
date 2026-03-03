export function checkValidity(nickname: string): string {
  if (nickname.length > 15) return "Too many characters";
  if (!/^[a-zA-z0-9]+$/.test(nickname)) return "Only characters and digits";
  return "Success";
}

// Can make this more complex with time if needed. For now users are limited to simple names
