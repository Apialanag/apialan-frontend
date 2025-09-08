import React, { useEffect } from 'react';

const PaymentBrick = ({ amount, payer, onSubmit, onError }) => {
  const brickContainerId = "payment-brick-container";

  useEffect(() => {
    let brickInstance;

    const renderPaymentBrick = async () => {
      const publicKey = 'APP_USR-f54c0a87-044e-4d93-9ef2-d3d406d99b00';
      const mp = new window.MercadoPago(publicKey, {
        locale: 'es-CL'
      });
      const bricksBuilder = mp.bricks();

      const settings = {
        initialization: {
          amount: Math.round(amount),
          payer: {
            email: payer.email,
            entityType: payer.entityType,
          },
        },
        customization: {
          visual: { style: { theme: 'default' } },
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
          },
        },
        callbacks: {
          onReady: () => {
            /* Callback called when Brick is ready. */
          },
          onSubmit: (mercadoPagoData) => {
            if (onSubmit) {
              // This promise is to handle the async operation in the parent
              return new Promise((resolve, reject) => {
                onSubmit(mercadoPagoData).then(resolve).catch(reject);
              });
            }
          },
          onError: (error) => {
            if (onError) {
              onError(error);
            }
          },
        },
      };

      brickInstance = await bricksBuilder.create('payment', brickContainerId, settings);
    };

    renderPaymentBrick();

    return () => {
      if (brickInstance) {
        brickInstance.unmount();
      }
    };
    // The empty dependency array is crucial.
    // It ensures this effect runs only once when the component mounts.
    // The parent component will control re-mounting using a `key` prop.
  }, []);

  return <div id={brickContainerId} />;
};

export default PaymentBrick;
