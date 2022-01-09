interface GenericErrorProps {
  errMsg?: string, errCode?: number
}
export default function GenericError(props:GenericErrorProps){
  return (<main className="pt-5">
    <h1>We're sorry!</h1>
    { props.errMsg ?
        <p>
          The following error occured and could not be handled properly: <br />
          "{props.errMsg}" {props.errCode ? `Code: ${props.errCode}` : ''}
        </p>
      :
        <p>
          An error occured that could not be handled properly.
        </p>
    }
  </main>
  );
}