import mongoose, { Schema, Document } from 'mongoose';

interface IPrize {
    position: number;
    prize: number;
    label: string;
}

interface ISchedule {
    round: number;
    datetime: Date;
}

interface IRule {
    round: number;
    roundName: string;
    roundDesc?: string;
    roundRules: string[];
}

interface IPlatform {
    round?: number;
    name: string;
    link: string;
}

export interface IEvent extends Document {
    name: string;
    description?: string;
    introduction?: string;
    prizes: IPrize[];
    schedule: ISchedule[];
    rules: IRule[];
    fees: number;
    teamSize: {
        min: number;
        max: number;
    };
    logo?: string;
    contact: string[];
    platform: IPlatform[];
    category: string; // NEW: Workshop, Competition, etc.
    venue?: string; // NEW
    isActive: boolean; // NEW: Admin can disable
    createdAt: Date;
    updatedAt: Date;
}

const prizeSchema = new Schema(
    {
        position: {
            type: Number,
            required: true,
        },
        prize: {
            type: Number,
            required: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false }
);

const scheduleSchema = new Schema(
    {
        round: {
            type: Number,
            required: true,
        },
        datetime: {
            type: Date,
            required: true,
        },
    },
    { _id: false }
);

const ruleSchema = new Schema(
    {
        round: {
            type: Number,
            required: true,
        },
        roundName: {
            type: String,
            required: true,
            trim: true,
        },
        roundDesc: {
            type: String,
            trim: true,
        },
        roundRules: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

const platformSchema = new Schema(
    {
        round: {
            type: Number,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        link: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const eventSchema = new Schema<IEvent>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        introduction: {
            type: String,
            trim: true,
        },
        prizes: {
            type: [prizeSchema],
            default: [],
        },
        schedule: {
            type: [scheduleSchema],
            default: [],
        },
        rules: {
            type: [ruleSchema],
            default: [],
        },
        fees: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        teamSize: {
            min: {
                type: Number,
                required: true,
                default: 1,
                min: 1,
            },
            max: {
                type: Number,
                required: true,
                default: 1,
                min: 1,
            },
        },
        logo: {
            type: String, // Cloudinary URL
        },
        contact: {
            type: [String],
            default: [],
        },
        platform: {
            type: [platformSchema],
            default: [],
        },
        // NEW FIELDS for this year
        category: {
            type: String,
            required: true,
            trim: true,
            // Examples: Workshop, Competition, Seminar, Cultural, Technical
        },
        venue: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
eventSchema.index({ isActive: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ name: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);
