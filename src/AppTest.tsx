import React from 'react';

function AppTest() {
  console.log('AppTest component is rendering');

  React.useEffect(() => {
    console.log('AppTest mounted');
    // Also try to update the document title to confirm it's running
    document.title = 'Test App Running!';

    // Check if our content is in the DOM
    const rootContent = document.getElementById('root')?.innerHTML;
    console.log('Root element content after mount:', rootContent?.substring(0, 200));
  }, []);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'red',
      color: 'white',
      fontSize: '24px',
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: 99999
    }}>
      <h1>Test App - React is Mounted!</h1>
      <p>If you can see this, React is working.</p>
      <button onClick={() => alert('Button clicked!')}>Test Button</button>
    </div>
  );
}

export default AppTest;