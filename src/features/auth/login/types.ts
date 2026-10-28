export type LoginData = Readonly<{
  identifier: string;
  password: string;
}>;

export type LoginRequest = Readonly<{
  identifier: string;
  password: string;
}>;

export type LoginErrors = Partial<Record<keyof LoginData, string>>;
