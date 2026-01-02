import mongoose, { Schema, Document } from 'mongoose';

interface IRegistration {
    eventId: mongoose.Types.ObjectId;
    teamMembers: mongoose.Types.ObjectId[];
}

export interface IOrder extends Document {
    orderId: string;
    userId: mongoose.Types.ObjectId; // Team leader 
    registrations: IRegistration[];
    transactionId: string;
    totalAmount: number;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    verifiedAt?: Date;
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const registrationSchema = new Schema(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },
        teamMembers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
        ],
    },
    { _id: false } // Don't create separate IDs for sub-documents
);

const orderSchema = new Schema<IOrder>(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        registrations: {
            type: [registrationSchema],
            required: true,
            validate: {
                validator: function (v: IRegistration[]) {
                    return v.length > 0;
                },
                message: 'Order must have at least one registration',
            },
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            required: true,
            enum: ['PENDING', 'VERIFIED', 'REJECTED'],
            default: 'PENDING',
            index: true,
        },
        verifiedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ 'registrations.eventId': 1 });
orderSchema.index({ 'registrations.teamMembers': 1 });

orderSchema.pre('save', async function () {
    if (!this.orderId) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderId = `ORD${String(count + 1).padStart(6, '0')}`;
    }
});
export default mongoose.model<IOrder>('Order', orderSchema);
