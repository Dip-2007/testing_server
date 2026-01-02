import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    clerkId: string;
    email: string;
    name: string;
    mobile: string;
    college: string;
    year: '1st' | '2nd' | '3rd' | '4th';
    branch: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        mobile: {
            type: String,
            required: true,
            match: [/^\d{10}$/, 'Mobile number must be 10 digits'],
        },
        college: {
            type: String,
            required: true,
            trim: true,
        },
        year: {
            type: String,
            required: true,
            enum: ['1st', '2nd', '3rd', '4th'],
        },
        branch: {
            type: String,
            required: true,
            trim: true,
        },
        isAdmin: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ clerkId: 1 });

export default mongoose.model<IUser>('User', userSchema);
