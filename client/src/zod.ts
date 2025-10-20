import { z } from 'zod';
export const registrationSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .trim()
    .nonempty('Full name is required'),
  email: z.string()
    .email('Please enter a valid email')
    .nonempty('Email is required'),
  phone: z.string()
    .regex(/^\+?[\d\s-()]{10,}$/, 'Please enter a valid phone number')
    .nonempty('Phone number is required'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .nonempty('Password is required'),
  confirmPassword: z.string()
    .nonempty('Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const otpSchema = z.string()
  .length(4, 'OTP must be 4 digits')
  .regex(/^\d+$/, 'OTP must contain only numbers');

export type RegistrationForm = z.infer<typeof registrationSchema>;


export const contactSchema = z.object({
   name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  mobile: z.string()
    .regex(/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number')
    .transform(val => val.replace(/\s/g, '')),
})

export const scheduleSchema = z.object({
   date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time slot'),
})


export const addressSchema = z.object({
  // Map 'Address Title' to 'name'
title: z.string().min(2, 'Address title is required').trim(),
 addressLine: z.string().min(5, 'Address line is required').trim(),
 phone_number: z.string()
    .regex(/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid phone number')
    .nonempty('Phone number is required'),
room_number: z.string().min(1, 'Room number is required').trim().nonempty('Room number is required'),
 landmark: z.string().optional(), 
 city: z.string().min(2, 'City is required').trim().nonempty('City is required'),
 area: z.string().min(2, 'Area is required').trim().nonempty('Area is required'),
 country: z.string().min(2, 'Country is required').trim().nonempty('Country is required'),
 state: z.string().min(2, 'State is required').trim().nonempty('State is required'),
 pincode: z.string().regex(/^\d{6}$/, 'PIN code must be 6 digits').nonempty('PIN code is required'),
 delivery_suggestion: z.string().max(200, 'Delivery suggestion must be under 200 characters').trim().optional(),
});


export type AddressForm = z.infer<typeof addressSchema>;
export type ScheduleForm = z.infer<typeof scheduleSchema>;
export type ContactForm = z.infer<typeof contactSchema>;
