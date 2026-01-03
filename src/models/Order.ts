import mongoose, { Schema, Document } from 'mongoose';

interface IRegistration {
    eventId: mongoose.Types.ObjectId;
    teamMembers: mongoose.Types.ObjectId[];
    selectedDomain?: string;
    selectedPS?: string;
}

export interface IOrder extends Document {
    orderId: string;
    userId: mongoose.Types.ObjectId;
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
        teamMembers: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                }
            ],
            validate: {
                validator: function (v: mongoose.Types.ObjectId[]) {

                    return v.length === new Set(v.map(id => id.toString())).size;
                },
                message: 'Duplicate team members not allowed'
            }
        },
        selectedDomain: {
            type: String,
            trim: true,
        },
        selectedPS: {
            type: String,
            trim: true,
        },
    },
    { _id: false }
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
            trim: true,
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
        verifiedAt: { type: Date },
        rejectionReason: { type: String, trim: true },
    },
    { timestamps: true }
);

// Indexes
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ 'registrations.eventId': 1 });
orderSchema.index({ 'registrations.teamMembers': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });  // ✅ For admin dashboard

// Validation: Team leader must be in team members
orderSchema.pre('save', async function () {
    for (const reg of this.registrations) {
        const leaderInTeam = reg.teamMembers.some(
            memberId => memberId.toString() === this.userId.toString()
        );

        if (!leaderInTeam) {
            throw new Error('Team leader must be included in team members');
        }
    }

});

orderSchema.pre('save', async function () {
    if (!this.orderId) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderId = `ORD${String(count + 1).padStart(6, '0')}`;
    }
});

export default mongoose.model<IOrder>('Order', orderSchema);
