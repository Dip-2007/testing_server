import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    clerkId: string;
    email: string;
    firstName: string;
    lastName: string;
    college: string;
    year: string;
    branch: string;
    phoneNumber: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema: Schema = new Schema(
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
            index: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        college: {
            type: String,
            default: '',
            trim: true,
        },
        year: {
            type: String,
            default: '',
        },
        branch: {
            type: String,
            default: '',
            trim: true,
        },
        phoneNumber: {
            type: String,
            default: '',
            validate: {  // ✅ Added phone validation
                validator: function (v: string) {
                    return !v || /^[0-9]{10}$/.test(v);
                },
                message: 'Phone number must be 10 digits'
            }
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


userSchema.index({ college: 1, year: 1 });

export default mongoose.model<IUser>('User', userSchema);
