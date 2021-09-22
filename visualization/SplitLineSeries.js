import { LineSeries } from "react-vis";

export function SplitLineSeries(props) {
  const { data, color, ...other } = props;

  const ndays = 14;
  const len = data.length;

  const dataLeft = data.slice(0, len - ndays);
  const dataRight = data.slice(len - ndays - 1);

  return [
    <LineSeries {...props} data={data} color={color} />,
    <LineSeries {...props} data={dataRight} color="green" />,
  ];
}
