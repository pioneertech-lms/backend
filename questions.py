import pandas as pd
import random

# Define the topics based on the JSON structure provided earlier
topics_data = {
    "11th": {
        "physics": [
            "Physical World and Measurement",
            "Kinematics",
            "Laws of Motion",
            "Work, Energy and Power",
            "Motion of System of Particles and Rigid Body",
            "Gravitation",
            "Properties of Bulk Matter",
            "Thermodynamics",
            "Behaviour of Perfect Gas and Kinetic Theory",
            "Oscillations and Waves",
        ],
        "chemistry": [
            "Some Basic Concepts of Chemistry",
            "Structure of Atom",
            "Classification of Elements and Periodicity in Properties",
            "Chemical Bonding and Molecular Structure",
            "States of Matter: Gases and Liquids",
            "Thermodynamics",
            "Equilibrium",
            "Redox Reactions",
            "Hydrogen",
            "s-Block Element (Alkali and Alkaline earth metals)",
            "Some p-Block Elements",
            "Organic Chemistry - Some Basic Principles and Techniques",
            "Hydrocarbons",
            "Environmental Chemistry",
        ],
        "mathematics": [
            "Sets and Functions",
            "Algebra",
            "Coordinate Geometry",
            "Calculus",
            "Mathematical Reasoning",
            "Statistics and Probability",
        ],
        "biology": [
            "Diversity in Living World",
            "Structural Organisation in Animals and Plants",
            "Cell Structure and Function",
            "Plant Physiology",
            "Human physiology",
        ],
    },
    "12th": {
        "physics": [
            "Electrostatics",
            "Current Electricity",
            "Magnetic Effects of Current and Magnetism",
            "Electromagnetic Induction and Alternating Currents",
            "Electromagnetic Waves",
            "Optics",
            "Dual Nature of Matter and Radiation",
            "Atoms and Nuclei",
            "Electronic Devices",
        ],
        "chemistry": [
            "Solid State",
            "Solutions",
            "Electrochemistry",
            "Chemical Kinetics",
            "Surface Chemistry",
            "General Principles and Processes of Isolation of Elements",
            "p-Block Elements",
            "d and f Block Elements",
            "Coordination Compounds",
            "Haloalkanes and Haloarenes",
            "Alcohols, Phenols and Ethers",
            "Aldehydes, Ketones and Carboxylic Acids",
            "Organic Compounds Containing Nitrogen",
            "Biomolecules",
            "Polymers",
            "Chemistry in Everyday Life",
        ],
        "mathematics": [
            "Relations and Functions",
            "Algebra",
            "Calculus",
            "Vectors and Three-Dimensional Geometry",
            "Linear Programming",
            "Probability",
        ],
        "biology": [
            "Reproduction",
            "Genetics and Evolution",
            "Biology and Human Welfare",
            "Biotechnology and Its Applications",
            "Ecology and Environment",
        ],
    },
}


# Define a function to generate questions
def generate_questions(num_questions, subjects_topics):
    questions_batch = []
    for i in range(1, num_questions + 1):
        # Choose the grade randomly
        grade = random.choice(["11th", "12th"])
        # Choose the subject randomly within the chosen grade
        subject = random.choice(list(subjects_topics[grade].keys()))
        # Choose the topic randomly within the chosen subject
        topic = random.choice(subjects_topics[grade][subject])
        question = f"Sample question {i} for {grade} {subject} related to {topic}."
        optionOne = f"Option A for question {i}"
        optionTwo = f"Option B for question {i}"
        optionThree = f"Option C for question {i}"
        optionFour = f"Option D for question {i}"
        answer = random.randint(1, 4)
        explanation = f"Explanation for question {i}."
        yearOfAppearance = random.choice([2019, 2020, 2021, 2022])
        exam = random.choice(["cet", "jee", "neet"])
        marks = random.choice([1, 2, 3, 4])

        questions_batch.append(
            {
                "number": i,
                "question": question,
                "questionImage": "",
                "optionOne": optionOne,
                "optionOneImage": "",
                "optionTwo": optionTwo,
                "optionTwoImage": "",
                "optionThree": optionThree,
                "optionThreeImage": "",
                "optionFour": optionFour,
                "optionFourImage": "",
                "answer": answer,
                "explanation": explanation,
                "explanationImage": "",
                "topic": topic,
                "yearOfAppearance": yearOfAppearance,
                "examination": exam,
                "marks": marks,
            }
        )
    return questions_batch


# Generate the questions
questions = generate_questions(1000, topics_data)

# Convert to DataFrame
questions_df = pd.DataFrame(questions)

# Save to an Excel file
output_file_path = "sample_questions.xlsx"
questions_df.to_excel(output_file_path, index=False)

print(f"Questions saved to {output_file_path}")
