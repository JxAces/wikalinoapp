import { Pressable, Text, View } from "react-native";

type Props = {
  question: {
    question: string;
    choices: string[];
    answer: string;
  };
  selectedAnswer?: string;
  onSelect: (value: string) => void;
};

export default function MultipleChoiceChallenge({
  question,
  selectedAnswer,
  onSelect,
}: Props) {
  return (
    <View>
      <Text>{question.question}</Text>

      {question.choices.map((choice) => (
        <Pressable key={choice} onPress={() => onSelect(choice)}>
          <Text>{choice}</Text>
        </Pressable>
      ))}
    </View>
  );
}
