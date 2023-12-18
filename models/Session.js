import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        default: null,
        // required: true,
        // unique: true
    },
},
{
    timestamps: true
}
);


sessionSchema.pre('save', function(next) {
    // if (!this.isNew) {
    //     return next();
    // }
    this.sessionId = uuidv4();
    next();
});



export const Session = mongoose.model('Session', sessionSchema);
