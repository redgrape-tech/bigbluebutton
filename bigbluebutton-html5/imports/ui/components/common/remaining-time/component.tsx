import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import humanizeSeconds from '/imports/utils/humanizeSeconds';
import { setCapturedContentUploading } from './service';
import { Text, Time } from './styles';
import { notify } from '/imports/ui/services/notification';
import { Meteor } from 'meteor/meteor';
import useTimeSync from '/imports/ui/core/local-states/useTimeSync';

type intlMsg = {
  id: string;
  description?: string;
};

interface RemainingTimeProps {
  referenceStartedTime: number;
  durationInSeconds: number;
  durationLabel: intlMsg;
  isBreakout: boolean;
  boldText: boolean;
  endingLabel?: intlMsg;
  alertLabel?: intlMsg;
}

const defaultProps = {
  endingLabel: undefined,
  alertLabel: undefined,
};

const METEOR_SETTINGS_APP = Meteor.settings.public.app;
const REMAINING_TIME_ALERT_THRESHOLD_ARRAY: [number] = METEOR_SETTINGS_APP.remainingTimeAlertThresholdArray;

let lastAlertTime: number | null = null;

const RemainingTime: React.FC<RemainingTimeProps> = (props) => {
  const {
    referenceStartedTime,
    durationInSeconds,
    durationLabel,
    endingLabel,
    alertLabel,
    isBreakout,
    boldText,
  } = props;

  const intl = useIntl();
  const [timeSync] = useTimeSync();
  const timeRemainingInterval = React.useRef<ReturnType<typeof setTimeout>>();
  const [remainingTime, setRemainingTime] = useState<number>(-1);

  const currentDate: Date = new Date();
  const adjustedCurrent: Date = new Date(currentDate.getTime() + timeSync);

  const calculateRemainingTime = () => {
    const durationInMilliseconds = durationInSeconds * 1000;
    const adjustedCurrentTime = adjustedCurrent.getTime();

    return Math.floor(((referenceStartedTime + durationInMilliseconds) - adjustedCurrentTime) / 1000);
  };

  useEffect(() => {
    if (remainingTime && durationInSeconds) {
      if (durationInSeconds > 0 && timeRemainingInterval && referenceStartedTime) {
        setRemainingTime(calculateRemainingTime());
      }

      clearInterval(timeRemainingInterval.current);
      const remainingMillisecondsDiff = (
        (referenceStartedTime + (durationInSeconds * 60000)) - adjustedCurrent.getTime()
      ) % 1000;
      timeRemainingInterval.current = setInterval(() => {
        setRemainingTime((currentTime) => currentTime - 1);
      }, remainingMillisecondsDiff === 0 ? 1000 : remainingMillisecondsDiff);
    }

    return () => {
      clearInterval(timeRemainingInterval.current);
    };
  }, [remainingTime, durationInSeconds]);

  const meetingTimeMessage = React.useRef<string>('');

  if (remainingTime >= 0 && timeRemainingInterval) {
    if (remainingTime > 0) {
      const alertsInSeconds = REMAINING_TIME_ALERT_THRESHOLD_ARRAY.map((item) => item * 60);

      if (alertsInSeconds.includes(remainingTime) && remainingTime !== lastAlertTime && alertLabel) {
        const timeInMinutes = remainingTime / 60;
        const msg = { id: `${alertLabel.id}${timeInMinutes === 1 ? 'Singular' : 'Plural'}` };
        const alertMessage = intl.formatMessage(msg, { 0: timeInMinutes });

        lastAlertTime = remainingTime;
        notify(alertMessage, 'info', 'rooms');
      }

      meetingTimeMessage.current = intl.formatMessage(durationLabel, { 0: humanizeSeconds(remainingTime) });
      if (isBreakout) {
        return (
          <span data-test="timeRemaining">
            {meetingTimeMessage.current}
          </span>
        );
      }
    } else {
      clearInterval(timeRemainingInterval.current);
      setCapturedContentUploading();
      if (endingLabel) meetingTimeMessage.current = intl.formatMessage(endingLabel);
    }
  }

  if (boldText) {
    const words = meetingTimeMessage.current.split(' ');
    const time = words.pop();
    const text = words.join(' ');

    return (
      <span data-test="timeRemaining">
        <Text>{text}</Text>
        <br />
        <Time data-test="breakoutRemainingTime">{time}</Time>
      </span>
    );
  }

  return (
    <span data-test="timeRemaining">
      {meetingTimeMessage.current}
    </span>
  );
};

RemainingTime.defaultProps = defaultProps;

export default RemainingTime;
