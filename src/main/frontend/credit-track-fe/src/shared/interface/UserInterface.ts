export interface UserInterface {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  role: string;
  program: string | null;
  createdAt: string;
  updatedAt: string;
}
