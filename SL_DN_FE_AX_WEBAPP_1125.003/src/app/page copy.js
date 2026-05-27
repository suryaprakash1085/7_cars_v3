// "use client";

// import React, { useState } from 'react';
// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Box, Container, Typography, TextField, Button, Link } from '@mui/material';

// // Sample user data (this could be fetched from an API in real applications)
// const users = [
//   { email: 'user@gmail.com', password: 'user', role: 'user' },
//   { email: 'admin@gmail.com', password: 'admin', role: 'admin' },
//   { email: 'pk@gmail.com', password: 'pk', role: 'admin' },
// ];

// export default function SignIn() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const router = useRouter();  

//   const handleSubmit = (e) => {
//     e.preventDefault(); // Prevent page refresh on form submit

//     // Check for valid credentials
//     const foundUser = users.find(user => user.email === email && user.password === password);

//     if (foundUser) {
//       // Store user role in localStorage for persistent login
//       Cookies.set('role', foundUser.role);
      
//       // Redirect based on user role
//       if (foundUser.role === 'user') {
//         router.push('/user');
//       } else if (foundUser.role === 'admin') {
//         router.push('/admin');
//       }
//     } else {
//       // Show error if credentials are wrong
//       setError('Invalid email or password. Please try again.');
//     }
//   };

//   return (
//     <div>
//       <Container component="main" maxWidth="xs">
//         <Box
//           sx={{
//             marginTop: 8,
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             padding: 3,
//             boxShadow: 3,
//             borderRadius: 2,
//             backgroundColor: 'white',
//           }}
//         >
//           <Typography component="h1" variant="h5">
//             Sign in to your account
//           </Typography>

//           {error && (
//             <Typography color="error" sx={{ mt: 2 }}>
//               {error}
//             </Typography>
//           )}

//           <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               id="email"
//               label="Email Address"
//               name="email"
//               autoComplete="email"
//               autoFocus
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               name="password"
//               label="Password"
//               type="password"
//               id="password"
//               autoComplete="current-password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />

//             <Box display="flex" justifyContent="space-between" alignItems="center">
//               <Link href="#" variant="body2">
//                 Forgot password?
//               </Link>
//             </Box>

//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               sx={{ mt: 3, mb: 2 }}
//             >
//               Sign In
//             </Button>

//             <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
//               Not a member?{' '}
//               <Link href="#" variant="body2">
//                 Start a 14-day free trial
//               </Link>
//             </Typography>
//           </Box>
//         </Box>
//       </Container>
//     </div>
//   );
// }


"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, TextField, Button, Link } from '@mui/material';
import { jwtDecode } from 'jwt-decode';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();  

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh on form submit

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    console.log('Submitting:', { email, password }); // Debug log

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response Status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const data = await response.json();
      console.log('Response Data:', data); // Debug log

      // Decode the JWT and store the token data in localStorage
      const decoded = jwtDecode(data.token);
      Cookies.set('token', data.token); // Store the raw token
      Cookies.set('userData', JSON.stringify(decoded)); // Store the decoded token

      // Navigate based on the user role
      if (decoded['role'] === 'user') {
        router.push('/user');
      } else if (decoded['role'] === 'admin') {
        router.push('/admin');
      }
    } catch (error) {
      setError(error.message || 'Invalid email or password. Please try again.');
      console.log('Login error:', error);
    }
  };

  return (
    <div>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 3,
            boxShadow: 3,
            borderRadius: 2,
            backgroundColor: 'white',
          }}
        >
          <Typography component="h1" variant="h5">
            Sign in to your account
          </Typography>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>

            {/* <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Not a member?{' '}
              <Link href="#" variant="body2">
                Start a 14-day free trial
              </Link>
            </Typography> */}
          </Box>
        </Box>
      </Container>
    </div>
  );
}
