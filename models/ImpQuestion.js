import mongoose,{Schema } from 'mongoose';

const schema = new mongoose.Schema({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    questions: {
        type: [Schema.Types.ObjectId],
        ref: 'Question',
        required: true
    },
},
{ timestamps: true}
);

export const ImpQuestion = mongoose.model('ImpQuestion', schema);
