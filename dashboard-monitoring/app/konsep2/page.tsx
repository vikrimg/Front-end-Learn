import Image from "next/image";

export default function Home() {
  return (
    <div className="h-screen w-screen bg-[#131b1d] overflow-hidden flex flex-col">

      <header className="shrink-0">
        <div className="bg-[#151f22] shadow-[6px_6px_14px_#0a0f10,-6px_-6px_14px_#1e2c2f] text-teal-300 flex justify-between items-center px-6 py-10 text-2xl font-bold">
          <span className="text-4xl [text-shadow:0_0_6px_#2dd4bf,0_0_16px_#2dd4bf66]">10:27:22</span>
          <span className="text-6xl text-teal-200 [text-shadow:0_0_8px_#2dd4bf,0_0_22px_#2dd4bf80]">MAIN ASSY</span>
          <span className="text-4xl [text-shadow:0_0_6px_#2dd4bf,0_0_16px_#2dd4bf66]">17/07/26</span>
        </div>
      </header>
      
      <div className="m-2"></div>
      
      <main className="flex-1 min-h-0 p4">
        
        <div className="flex gap-4 h-full">
        <div className="m-0.5"></div>

          <div className="w-1/3 flex flex-col gap-4">
            <Box title="Target" value={99} icon="/icon/01_tgt.svg" />
            <Box title="Assy Out" value={99} icon="/icon/02_out.svg" />
            <Box title="EFF" value={99} icon="/icon/03_eff.svg"/>
            <Box title="JPH" value={99} icon="/icon/04_jph.svg"/>
            <Box title="C/T" value={99} icon="/icon/05_ct.svg"/>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {/* <div className=""> */}

              <div className="grid grid-cols-2 gap-4 flex-1">
                <Card title="Quality" freq={20} minutes={5} warning={true}/>
                <Card title="Logistic" freq={20} minutes={5} warning={false}/>
                <Card title="Equipment" freq={20} minutes={5} warning={false}/>
                <Card title="Process"freq={20} minutes={5} warning={false}/>
              </div>

              <div className="bg-[#151f22] shadow-[6px_6px_14px_#0a0f10,-6px_-6px_14px_#1e2c2f] flex justify-between items-center px-6 md:h-30 text-2xl rounded-[10px]">
                <span></span>
                <span className="text-5xl font-bold text-teal-200 [text-shadow:0_0_8px_#2dd4bf,0_0_22px_#2dd4bf80]">Handover</span>
                <span className="bg-[#101617] shadow-[inset_5px_5px_10px_#050809,inset_-5px_-5px_10px_#1e2c2f] text-teal-300 [text-shadow:0_0_8px_#2dd4bf,0_0_18px_#2dd4bf80] text-7xl font-bold text-center md:w-160 py-5 rounded-[10px]">999</span>
              </div>

            {/* </div> */}
          </div>
        <div className="m-1"></div>

        </div>
        
      </main>
      <div className="m-2"></div>
    </div>
  );
}

type BoxProps = {
  title : string,
  value : number,
  icon? :string;
}

function Box({ title, value , icon }: BoxProps) {
  return (
    <div className="bg-[#182225] shadow-[6px_6px_14px_#0a0f10,-6px_-6px_14px_#1e2c2f] flex-1 flex justify-between items-center px-6 py-4 text-5xl rounded-[10px]">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-15 h-15 bg-[#0e1516] rounded-full flex items-center justify-center p-2.5 shadow-[inset_3px_3px_6px_#050809,inset_-3px_-3px_6px_#1e2c2f]">

            <div className="relative w-8 h-8">
              <div
                className="absolute inset-0 bg-teal-400 blur-md opacity-80"
                style={{
                  WebkitMask: `url(${icon}) no-repeat center / contain`,
                  mask: `url(${icon}) no-repeat center / contain`,
                }}
              />
              <div
                className="w-8 h-8 bg-teal-300"
                style={{
                  WebkitMask: `url(${icon}) no-repeat center / contain`,
                  mask: `url(${icon}) no-repeat center / contain`,
                  filter: "drop-shadow(0 0 6px #2dd4bf) drop-shadow(0 0 14px #2dd4bf) drop-shadow(0 0 24px #2dd4bf80)",
                }}
                />
              </div>
            </div>          
        )}

      <span className="font-bold text-teal-100">{title}</span>
      </div>
      <span className="bg-[#101617] shadow-[inset_4px_4px_8px_#050809,inset_-4px_-4px_8px_#1e2c2f] text-teal-300 [text-shadow:0_0_6px_#2dd4bf,0_0_14px_#2dd4bf80] text-5xl font-bold w-[250px] h-[100px] flex items-center justify-center rounded-[5px]">
        {value}
      </span>
    </div>
  );
}

type cardProps = {
  title: string,
  freq: number,
  minutes: number,
  warning: boolean
}

function Card({ title, freq, minutes, warning}: cardProps) {
  return (
    // <div className="bg-[#182225] shadow-[6px_6px_14px_#0a0f10,-6px_-6px_14px_#1e2c2f] h-full flex flex-col rounded-[10px]">
    <div className={`${warning ? "bg-[#552626]" : "bg-[#182225]"} shadow-[6px_6px_14px_#0a0f10,-6px_-6px_14px_#1e2c2f] h-full flex flex-col rounded-[10px]`}>
      {/* <div className={`bg-[#151f22] text-teal-200 [text-shadow:0_0_6px_#2dd4bf,0_0_16px_#2dd4bf80] text-center text-4xl font-bold py-8 animate-none rounded-t-[10px]`}> */}
      <div className={`${warning ? "bg-[#8d1d1d] text-red-400" : "bg-[#182225]"} [text-shadow:0_0_6px_#2dd4bf,0_0_16px_#2dd4bf80] text-center text-4xl font-bold py-8 animate-none rounded-t-[10px]`}>
        {title}
      </div>

      <div className="flex flex-1 justify-evenly items-center text-xl">
        <div className="flex flex-col h-full text-center">
            <div className="text-4xl my-10 mb-1 text-teal-100">Frequency</div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-teal-200 [text-shadow:0_0_8px_#2dd4bf,0_0_18px_#2dd4bf80] text-7xl">{freq}</div>
            </div>
        </div>

        <div className="w-1 bg-[#0e1516] self-stretch my-5 rounded-full shadow-[inset_2px_2px_4px_#050809,inset_-2px_-2px_4px_#1e2c2f]"></div>
        <div className="flex flex-col h-full text-center">
          <div className="text-4xl my-10 mb-1 text-teal-100">Minutes</div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white [text-shadow:0_0_8px_#2dd4bf80] text-7xl">{minutes}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
