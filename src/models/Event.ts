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

interface IProblemStatement {
    psId: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface ILink {
    name: string;
    link: string;
}

interface IDomain {
    domainId: string;
    name: string;
    description?: string;
    problemStatements: IProblemStatement[];
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
    imgUrl?: string; // Event banner/poster image
    contact: string[];
    platform: IPlatform[];
    category: string;
    venue?: string;
    isActive: boolean;
    links?: ILink[]; // External links (WhatsApp, Google Forms, etc.)

    // Hackathon specific
    isHackathon?: boolean;
    domains?: IDomain[];

    createdAt: Date;
    updatedAt: Date;
}

const prizeSchema = new Schema(
    {
        position: { type: Number, required: true },
        prize: { type: Number, required: true },
        label: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const scheduleSchema = new Schema(
    {
        round: { type: Number, required: true },
        datetime: { type: Date, required: true },
    },
    { _id: false }
);

const ruleSchema = new Schema(
    {
        round: { type: Number, required: true },
        roundName: { type: String, required: true, trim: true },
        roundDesc: { type: String, trim: true },
        roundRules: { type: [String], default: [] },
    },
    { _id: false }
);

const platformSchema = new Schema(
    {
        round: { type: Number },
        name: { type: String, required: true, trim: true },
        link: { type: String, required: true },
    },
    { _id: false }
);

const problemStatementSchema = new Schema(
    {
        psId: { type: String, required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        difficulty: {
            type: String,
            enum: ['Easy', 'Medium', 'Hard'],
            default: 'Medium'
        },
    },
    { _id: false }
);

// ✅ NEW: Domain Schema
const domainSchema = new Schema(
    {
        domainId: { type: String, required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        problemStatements: {
            type: [problemStatementSchema],
            default: [],
        },
    },
    { _id: false }
);

// ✅ NEW: Link Schema (for WhatsApp, Google Forms, etc.)
const linkSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        link: { type: String, required: true },
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
        description: { type: String, trim: true },
        introduction: { type: String, trim: true },
        prizes: { type: [prizeSchema], default: [] },
        schedule: { type: [scheduleSchema], default: [] },
        rules: { type: [ruleSchema], default: [] },
        fees: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        teamSize: {
            min: { type: Number, required: true, default: 1, min: 1 },
            max: { type: Number, required: true, default: 1, min: 1 },
        },
        logo: { type: String },
        imgUrl: { type: String }, // Event banner/poster image
        contact: { type: [String], default: [] },
        platform: { type: [platformSchema], default: [] },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        venue: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
        links: { type: [linkSchema], default: [] }, // External links (WhatsApp, Google Forms, etc.)

        // Hackathon specific
        isHackathon: {
            type: Boolean,
            default: false,
        },
        domains: {
            type: [domainSchema],
            default: [],
        },
    },
    { timestamps: true }
);

eventSchema.index({ isActive: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isHackathon: 1 });

export default mongoose.model<IEvent>('Event', eventSchema);
