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
            required: function (this: IOrder) {
                return this.totalAmount > 0;
            },
            unique: true,
            index: true,
            sparse: true, // Allow multiple null/undefined values
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
orderSchema.index({ status: 1, createdAt: -1 });

// ✅ FIXED PRE-SAVE HOOK (Async without next())
orderSchema.pre('save', async function () {
    // 1️⃣ Generate orderId if not present
    if (!this.orderId) {
        const OrderModel = mongoose.model('Order');

        // Find the last order sorted by createdAt (descending)
        // ✅ Properly typed to include orderId
        const lastOrder = await OrderModel.findOne(
            { orderId: { $exists: true, $ne: null } },
            { orderId: 1 }
        )
            .sort({ createdAt: -1 })
            .lean<{ _id: mongoose.Types.ObjectId; orderId: string }>()  // ✅ Type assertion
            .exec();

        let orderNumber = 1;

        if (lastOrder?.orderId) {
            // Extract number from "ORD000001" format
            const match = lastOrder.orderId.match(/ORD(\d+)/);
            if (match) {
                orderNumber = parseInt(match[1], 10) + 1;
            }
        }

        // Generate new orderId with 6-digit padding
        this.orderId = `ORD${orderNumber.toString().padStart(6, '0')}`;
    }

    // 2️⃣ Validate team leader is in all teams
    for (const reg of this.registrations) {
        const leaderInTeam = reg.teamMembers.some(
            memberId => memberId.toString() === this.userId.toString()
        );

        if (!leaderInTeam) {
            throw new Error(
                'You (team leader) must be included in the team members list for all events'
            );
        }
    }
});

// ✅ POST-SAVE HOOK for logging (optional)
orderSchema.post('save', function (doc) {
    console.log(`✅ Order saved: ${doc.orderId}`);
});

export default mongoose.model<IOrder>('Order', orderSchema);
