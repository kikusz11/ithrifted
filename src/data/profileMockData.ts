// Mock data for profile page preview
export const mockRootProps = {
  user: {
    id: "user-123",
    email: "mk.kikuszi@gmail.com"
  },
  profileData: {
    full_name: "Your Name",
    avatar_url: "https://i.pravatar.cc/150?img=1",
    shipping_address: {
      street: "Fő utca 123",
      city: "Budapest", 
      postal_code: "1011",
      country: "Magyarország"
    },
    billing_address: {
      street: "Váci út 456",
      city: "Budapest",
      postal_code: "1133", 
      country: "Magyarország"
    }
  }
};