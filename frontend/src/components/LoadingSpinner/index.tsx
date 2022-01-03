import "./style.css";

interface LoadingSpinnerProps {
  withText: boolean
  withPadding: boolean
  loadingText: string
}

export default function LoadingSpinner(props:LoadingSpinnerProps){
  return (
    <div className={props.withPadding ? "text-center pt-5" : "text-center"}>
      <div className="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {props.withText && <p>{props.loadingText}</p>}
    </div>
  )
}

LoadingSpinner.defaultProps = {
  withText: false,
  withPadding: false,
  loadingText: "Loading..."
}