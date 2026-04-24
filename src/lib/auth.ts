// Mock auth — placeholder for future Supabase integration
export interface User {
  name: string;
  email: string;
}

const KEY = "skillora_user";

export const auth = {
  signup(name: string, email: string, _password: string): User {
    const user = { name, email };
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  },
  login(email: string, _password: string): User {
    const existing = localStorage.getItem(KEY);
    const user = existing ? JSON.parse(existing) : { name: email.split("@")[0], email };
    user.email = email;
    localStorage.setItem(KEY, JSON.stringify(user));
    return user;
  },
  logout() {
    localStorage.removeItem(KEY);
  },
  current(): User | null {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  },
};
