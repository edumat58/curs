import { Stage, Layer, Rect, Line, Text, Group } from 'react-konva';

export default function PitagoraKonva() {
  const triangleProps = {
    fill: '#f0f0f0',
    stroke: 'black',
    strokeWidth: 1
  };

  const textProps = {
    fontSize: 36,
    fontFamily: 'Courier New',
    fill: 'black'
  };

  return (
    <Stage width={1000} height={600}>
      <Layer>
        {/* Primul pătrat cu triunghiurile și pătratul central */}
        <Group x={50} y={50}>
          <Rect x={0} y={0} width={400} height={400} stroke="black" strokeWidth={1} />

          {/* Triunghiuri */}
          <Line points={[0, 0, 100, 0, 0, 300]} closed {...triangleProps} />
          <Line points={[400, 0, 100, 0, 400, 100]} closed {...triangleProps} />
          <Line points={[400, 400, 300, 400, 400, 100]} closed {...triangleProps} />
          <Line points={[0, 400, 300, 400, 0, 300]} closed {...triangleProps} />

          {/* Pătrat interior c² */}
          
          <Text x={120} y={190} text="A▢ = c²" {...textProps} />

          {/* Laturi și etichete */}
          <Text x={250} y={-50} text="a" {...textProps} />
          <Text x={30} y={-50} text="b" {...textProps} />

          <Text x={30} y={420} text="a" {...textProps} />
          <Text x={340} y={420} text="b" {...textProps} />

          <Text x={-50} y={120} text="a" {...textProps} />
          <Text x={-50} y={340} text="b" {...textProps} />

          <Text x={420} y={280} text="a" {...textProps} />
          <Text x={420} y={30} text="b" {...textProps} />

          <Text x={30} y={20} text="I" {...textProps} />
          <Text x={300} y={20} text="II" {...textProps} />
          <Text x={325} y={340} text="III" {...textProps} />
          <Text x={30} y={340} text="IV" {...textProps} />
        </Group>

        {/* A doua figură: a² + b² */}
        <Group x={500} y={50}>
          <Rect x={0} y={0} width={400} height={400} stroke="black" strokeWidth={1} />

          {/* Triunghiuri */}
          <Line points={[0, 0, 0, 300, 100, 0]} closed {...triangleProps} />
          <Line points={[100, 0, 100, 300, 0, 300]} closed {...triangleProps} />
          <Line points={[100, 300, 400, 300, 400, 400]} closed {...triangleProps} />
          <Line points={[100, 300, 100, 400, 400, 400]} closed {...triangleProps} />
          
        

          {/* Etichete și acolade */}
          <Text x={180} y={-30} text="a" {...textProps} />
          <Text x={-30} y={180} text="b" {...textProps} />
          <Text x={30} y={20} text="I" {...textProps} />
          <Text x={120} y={340} text="IV" {...textProps} />
          <Text x={350} y={320} text="II" {...textProps} />
          <Text x={30} y={250} text="III" {...textProps} />

          <Text x={120} y={410} text="A▢ = a² + b²" {...textProps} />
        </Group>
      </Layer>
    </Stage>
  );
}

