export function checkValidity(nickname: string): string {
  if (nickname.length > 15) return "Nickname can be max 15 characters";
  if (!/^[a-zA-Z0-9]+$/.test(nickname))
    return "Nickname can only contain characters and digits";
  return "Success";
}

// Can make this more complex with time if needed. For now users are limited to simple names
